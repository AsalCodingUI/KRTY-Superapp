import { Badge } from '@/shared/ui/information/Badge';
import { Table, TableBody, TableCell, TableFoot, TableHead, TableHeaderCell, TableRoot, TableRow } from '@/shared/ui/structure/Table';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Structure/Table',
    component: Table,
    tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const data = [
    {
        name: "Viola Amherd",
        role: "Federal Councillor",
        department: "Defence, Civil Protection and Sport",
        status: "Active",
    },
    {
        name: "Simonetta Sommaruga",
        role: "Federal Councillor",
        department: "Environment, Transport, Energy and Communications",
        status: "Active",
    },
    {
        name: "Alain Berset",
        role: "Federal Councillor",
        department: "Home Affairs",
        status: "Active",
    },
];

export const Default: Story = {
    render: () => (
        <TableRoot>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Role</TableHeaderCell>
                        <TableHeaderCell>Department</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.name}>
                            <TableCell className="font-medium text-content">{item.name}</TableCell>
                            <TableCell>{item.role}</TableCell>
                            <TableCell>{item.department}</TableCell>
                            <TableCell>
                                <Badge variant="success" size="sm">{item.status}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableRoot>
    ),
};

export const WithFooter: Story = {
    render: () => (
        <TableRoot>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Invoice</TableHeaderCell>
                        <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell>INV-001</TableCell>
                        <TableCell className="text-right">$250.00</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>INV-002</TableCell>
                        <TableCell className="text-right">$150.00</TableCell>
                    </TableRow>
                </TableBody>
                <TableFoot>
                    <TableRow>
                        <TableHeaderCell>Total</TableHeaderCell>
                        <TableHeaderCell className="text-right">$400.00</TableHeaderCell>
                    </TableRow>
                </TableFoot>
            </Table>
        </TableRoot>
    ),
};
